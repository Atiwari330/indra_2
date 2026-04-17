// Types modeled after Stedi's Healthcare API JSON schemas.
// https://www.stedi.com/docs/healthcare/api-reference
//
// Shapes are pared down to what the demo UI needs, but field names and
// nesting mirror Stedi so a future real-HTTP implementation can drop in
// without reshaping call sites.

// ─── 270 / 271 Eligibility ──────────────────────────────────────────

export interface EligibilityRequest {
  controlNumber: string;
  tradingPartnerServiceId: string; // Stedi Payer ID
  provider: {
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    npi: string;
  };
  subscriber: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYYMMDD
    gender?: 'M' | 'F' | 'U';
  };
  encounter?: {
    serviceTypeCodes?: string[]; // e.g. ["MH"] for mental health
    dateOfService?: string; // YYYYMMDD
  };
}

export interface EligibilityBenefit {
  code: string; // benefit information code (1=Active, 2=Inactive, ...)
  name: string; // human-readable
  serviceTypes: string[]; // e.g. ["Health Benefit Plan Coverage", "Mental Health"]
  coverageLevel?: 'Individual' | 'Family';
  timeQualifier?: string;
  benefitAmount?: number; // copay/coinsurance amount
  benefitPercent?: number;
  inPlanNetwork?: 'Yes' | 'No';
}

export interface EligibilityResponse {
  controlNumber: string;
  tradingPartnerServiceId: string;
  reassociationKey: string;
  payer: {
    name: string;
    payerIdentification: string;
  };
  provider: {
    providerName: string;
    npi: string;
  };
  subscriber: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    groupNumber?: string;
    groupDescription?: string;
  };
  planInformation: {
    planName?: string;
    planNumber?: string;
    planCoverageDescription?: string;
    planBeginDate?: string;
    planEndDate?: string;
  };
  benefitsInformation: EligibilityBenefit[];
  // Surfaced summary values the UI actually renders
  summary: {
    active: boolean;
    planName: string;
    copayAmount?: number;
    deductibleAmount?: number;
    deductibleRemaining?: number;
    outOfPocketMax?: number;
    outOfPocketRemaining?: number;
    coinsurancePercent?: number;
    inNetwork: boolean;
    mentalHealthCovered: boolean;
    priorAuthRequired: boolean;
    sessionsAuthorized?: number;
    sessionsUsed?: number;
  };
}

// ─── 837P Professional Claim Submission ─────────────────────────────

export interface StediAddress {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface StediContactInformation {
  name?: string;
  validContacts?: Array<{
    communicationMode?: 'Telephone' | 'Email' | 'Fax';
    communicationNumber?: string;
  }>;
}

export interface ProfessionalClaim {
  controlNumber: string;
  tradingPartnerServiceId: string; // Stedi Payer ID
  submitter: {
    organizationName: string;
    contactInformation: StediContactInformation;
  };
  receiver: {
    organizationName: string;
  };
  billing: {
    providerType: 'BillingProvider';
    npi: string;
    employerId: string; // Tax ID (EIN/SSN)
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    address: StediAddress;
    contactInformation: StediContactInformation;
    taxonomyCode?: string;
  };
  rendering?: {
    providerType: 'RenderingProvider';
    npi: string;
    firstName: string;
    lastName: string;
    taxonomyCode?: string;
  };
  subscriber: {
    memberId: string;
    paymentResponsibilityLevelCode: 'P' | 'S' | 'T'; // Primary/Secondary/Tertiary
    insuranceTypeCode?: string;
    groupNumber?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYYMMDD
    gender: 'M' | 'F' | 'U';
    address: StediAddress;
    individualRelationshipCode: '18' | '01' | '19'; // 18=self, 01=spouse, 19=child
  };
  dependent?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'M' | 'F' | 'U';
    address: StediAddress;
  };
  claimInformation: {
    claimFilingCode: string; // e.g. "CI" = Commercial Insurance
    patientControlNumber: string;
    claimChargeAmount: number;
    placeOfServiceCode: string; // e.g. "11" = office, "02" = telehealth
    claimFrequencyCode: '1'; // Original
    signatureIndicator: 'Y';
    providerAcceptAssignmentCode: 'A';
    benefitsAssignmentCertificationIndicator: 'Y';
    releaseInformationCode: 'Y';
    healthCareCodeInformation: Array<{
      diagnosisTypeCode: 'ABK' | 'ABF'; // ABK=principal, ABF=secondary
      diagnosisCode: string; // ICD-10 without dots
    }>;
    serviceLines: Array<{
      serviceLineNumber: string;
      professionalService: {
        procedureIdentifier: 'HC';
        procedureCode: string; // CPT
        procedureModifiers?: string[];
        lineItemChargeAmount: number;
        measurementUnit: 'UN' | 'MJ';
        serviceUnitCount: number;
        compositeDiagnosisCodePointers: {
          diagnosisCodePointers: number[];
        };
      };
      serviceDate: string; // YYYYMMDD
    }>;
  };
}

export interface ClaimSubmissionResponse {
  controlNumber: string;
  transactionId: string;
  tradingPartnerId: string; // Stedi internal
  claimReference: {
    correlationId: string;
    submitterId: string;
    claimControlNumber: string; // the X12 REF*D9
  };
  status: 'Accepted' | 'Rejected';
  errors?: Array<{
    field?: string;
    description: string;
    code?: string;
  }>;
  submittedAt: string; // ISO 8601
}

// ─── 277CA Claim Acknowledgment ─────────────────────────────────────

export interface ClaimAcknowledgment {
  controlNumber: string;
  correlationId: string;
  payer: {
    name: string;
    payerIdentification: string;
  };
  claimReference: {
    patientControlNumber: string;
    claimControlNumber: string;
  };
  claimStatus: {
    statusCategoryCode: string; // A1, A2, A3, etc.
    statusCategoryDescription: string;
    statusCode: string;
    statusDescription: string;
    effectiveDate: string; // YYYYMMDD
  };
  claimChargeAmount: number;
  acknowledgedAt: string; // ISO 8601
}

// ─── UI-layer convenience types ─────────────────────────────────────

/** What the UI consumes to render the claim preview + assemble the Stedi request. */
export interface DraftClaimInput {
  encounterId: string;
  patientId: string;
  noteId: string;
  patientName: { first: string; last: string };
  patientDob: string; // ISO YYYY-MM-DD
  patientGender: 'M' | 'F' | 'U';
  dateOfService: string; // ISO YYYY-MM-DD
  placeOfServiceCode: string;
  diagnoses: Array<{ icd10: string; description: string }>;
  serviceLines: Array<{
    cptCode: string;
    description: string;
    charge: number;
    units: number;
    diagnosisPointers: number[];
    modifiers?: string[];
  }>;
  payer: {
    name: string;
    stediPayerId: string;
  };
  subscriber: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    relationshipCode: '18' | '01' | '19';
  };
}
