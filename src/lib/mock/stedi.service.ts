// In-memory mock of the Stedi healthcare API. Returns Stedi-shaped
// JSON after a realistic delay so the UI feels live without needing
// a real account or network. Swap for an HTTP implementation via
// src/services/stedi.service.ts when a sandbox is wired up.

import type {
  EligibilityRequest,
  EligibilityResponse,
  ProfessionalClaim,
  ClaimSubmissionResponse,
  ClaimAcknowledgment,
  DraftClaimInput,
} from '@/lib/types/stedi';
import {
  buildEligibilityResponse,
  buildSubmissionResponse,
  buildAcknowledgment,
  getScenario,
  DEMO_BILLING_PROFILE,
  DEMO_RENDERING_PROVIDER,
} from './stedi-fixtures';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function formatYmd(iso: string): string {
  return iso.replace(/-/g, '');
}

function stripDot(icd: string): string {
  return icd.replace('.', '');
}

/**
 * Assemble a Stedi-shaped ProfessionalClaim from a DraftClaimInput.
 * Pure function — no side effects. Exposed so the UI can show the
 * raw JSON that would be sent to Stedi.
 */
export function assembleProfessionalClaim(input: DraftClaimInput): ProfessionalClaim {
  const patientControlNumber = `${input.encounterId.slice(0, 8)}-${Date.now().toString().slice(-6)}`;
  const totalCharge = input.serviceLines.reduce((sum, l) => sum + l.charge * l.units, 0);

  return {
    controlNumber: Math.floor(Math.random() * 900000000 + 100000000).toString(),
    tradingPartnerServiceId: input.payer.stediPayerId,
    submitter: {
      organizationName: DEMO_BILLING_PROFILE.organizationName,
      contactInformation: {
        name: 'Billing Department',
        validContacts: [
          { communicationMode: 'Telephone', communicationNumber: DEMO_BILLING_PROFILE.phone },
        ],
      },
    },
    receiver: {
      organizationName: input.payer.name,
    },
    billing: {
      providerType: 'BillingProvider',
      npi: DEMO_BILLING_PROFILE.npi,
      employerId: DEMO_BILLING_PROFILE.taxId.replace('-', ''),
      organizationName: DEMO_BILLING_PROFILE.organizationName,
      address: DEMO_BILLING_PROFILE.address,
      contactInformation: {
        name: 'Billing Department',
        validContacts: [
          { communicationMode: 'Telephone', communicationNumber: DEMO_BILLING_PROFILE.phone },
        ],
      },
      taxonomyCode: DEMO_BILLING_PROFILE.taxonomyCode,
    },
    rendering: {
      providerType: 'RenderingProvider',
      npi: DEMO_RENDERING_PROVIDER.npi,
      firstName: DEMO_RENDERING_PROVIDER.firstName,
      lastName: DEMO_RENDERING_PROVIDER.lastName,
      taxonomyCode: DEMO_RENDERING_PROVIDER.taxonomyCode,
    },
    subscriber: {
      memberId: input.subscriber.memberId,
      paymentResponsibilityLevelCode: 'P',
      groupNumber: undefined,
      firstName: input.subscriber.firstName,
      lastName: input.subscriber.lastName,
      dateOfBirth: formatYmd(input.subscriber.dateOfBirth),
      gender: input.patientGender,
      address: {
        address1: '125 Elm Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94103',
      },
      individualRelationshipCode: input.subscriber.relationshipCode,
    },
    claimInformation: {
      claimFilingCode: 'CI',
      patientControlNumber,
      claimChargeAmount: totalCharge,
      placeOfServiceCode: input.placeOfServiceCode,
      claimFrequencyCode: '1',
      signatureIndicator: 'Y',
      providerAcceptAssignmentCode: 'A',
      benefitsAssignmentCertificationIndicator: 'Y',
      releaseInformationCode: 'Y',
      healthCareCodeInformation: input.diagnoses.map((dx, i) => ({
        diagnosisTypeCode: i === 0 ? 'ABK' : 'ABF',
        diagnosisCode: stripDot(dx.icd10),
      })),
      serviceLines: input.serviceLines.map((line, i) => ({
        serviceLineNumber: String(i + 1),
        professionalService: {
          procedureIdentifier: 'HC',
          procedureCode: line.cptCode,
          procedureModifiers: line.modifiers,
          lineItemChargeAmount: line.charge,
          measurementUnit: 'UN',
          serviceUnitCount: line.units,
          compositeDiagnosisCodePointers: {
            diagnosisCodePointers: line.diagnosisPointers,
          },
        },
        serviceDate: formatYmd(input.dateOfService),
      })),
    },
  };
}

export class MockStediService {
  async checkEligibility(
    patientId: string,
    req: Partial<EligibilityRequest>,
  ): Promise<EligibilityResponse> {
    await delay(1800 + Math.random() * 600);
    const subscriberDob = req.subscriber?.dateOfBirth
      ? req.subscriber.dateOfBirth.length === 8
        ? `${req.subscriber.dateOfBirth.slice(0, 4)}-${req.subscriber.dateOfBirth.slice(4, 6)}-${req.subscriber.dateOfBirth.slice(6, 8)}`
        : req.subscriber.dateOfBirth
      : '1990-01-01';
    return buildEligibilityResponse(patientId, subscriberDob);
  }

  async submitProfessionalClaim(
    patientId: string,
    claim: ProfessionalClaim,
  ): Promise<ClaimSubmissionResponse> {
    await delay(2200 + Math.random() * 600);
    return buildSubmissionResponse(patientId, claim.claimInformation.patientControlNumber);
  }

  /**
   * Fire-and-forget acknowledgment poller. Calls `onAck` after the
   * scenario's configured delay so the UI can show the async 277CA
   * landing without the demo having to click anything.
   */
  watchForAcknowledgment(
    patientId: string,
    patientControlNumber: string,
    correlationId: string,
    totalCharge: number,
    onAck: (ack: ClaimAcknowledgment) => void,
  ): () => void {
    const scenario = getScenario(patientId);
    const handle = setTimeout(() => {
      onAck(
        buildAcknowledgment(patientId, patientControlNumber, correlationId, totalCharge),
      );
    }, scenario.acknowledgmentDelayMs);
    return () => clearTimeout(handle);
  }

  /**
   * Build a minimal HTML representation of a CMS-1500 claim. Returned
   * as a string the UI can drop into an iframe srcDoc. Not pixel-perfect;
   * good enough to show the customer "here's the form the payer sees."
   */
  generateCms1500Html(claim: ProfessionalClaim): string {
    const c = claim.claimInformation;
    const sub = claim.subscriber;
    const bill = claim.billing;
    const ren = claim.rendering;
    const dxRows = c.healthCareCodeInformation
      .map(
        (dx, i) =>
          `<td>${String.fromCharCode(65 + i)}. <strong>${dx.diagnosisCode}</strong></td>`,
      )
      .join('');
    const lineRows = c.serviceLines
      .map(
        (line) => `
      <tr>
        <td>${line.serviceDate}</td>
        <td>${c.placeOfServiceCode}</td>
        <td><strong>${line.professionalService.procedureCode}</strong>${line.professionalService.procedureModifiers?.length ? ` ${line.professionalService.procedureModifiers.join(' ')}` : ''}</td>
        <td>${line.professionalService.compositeDiagnosisCodePointers.diagnosisCodePointers.map((p) => String.fromCharCode(64 + p)).join('')}</td>
        <td>$${line.professionalService.lineItemChargeAmount.toFixed(2)}</td>
        <td>${line.professionalService.serviceUnitCount}</td>
        <td>${ren?.npi ?? ''}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>CMS-1500 — ${sub.firstName} ${sub.lastName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f6; margin: 0; padding: 24px; color: #1a1a1a; }
            .form { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #d0d0d0; padding: 32px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
            .form-header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
            .form-title { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
            .form-sub { font-size: 11px; color: #666; margin-top: 2px; }
            .box-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .box-value { font-size: 13px; font-weight: 500; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 14px; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1a1a1a; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e0e0e0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            th, td { border: 1px solid #d0d0d0; padding: 6px 8px; text-align: left; }
            th { background: #f2f2f2; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
            .dx-row td { width: 25%; font-size: 12px; }
            .total-row td { font-weight: 700; font-size: 13px; background: #fafafa; }
            .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="form">
            <div class="form-header">
              <div>
                <div class="form-title">HEALTH INSURANCE CLAIM FORM</div>
                <div class="form-sub">APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE (NUCC) · CMS-1500 (02/12)</div>
              </div>
              <div style="text-align: right;">
                <div class="box-label">Payer</div>
                <div class="box-value">${claim.receiver.organizationName}</div>
              </div>
            </div>

            <div class="grid-2">
              <div>
                <div class="box-label">1a. Insured's ID Number</div>
                <div class="box-value">${sub.memberId}</div>
              </div>
              <div>
                <div class="box-label">11. Insured's Policy Group</div>
                <div class="box-value">${sub.groupNumber ?? '—'}</div>
              </div>
            </div>

            <div class="grid-3">
              <div>
                <div class="box-label">2. Patient's Name</div>
                <div class="box-value">${sub.lastName}, ${sub.firstName}</div>
              </div>
              <div>
                <div class="box-label">3. Patient's Birth Date</div>
                <div class="box-value">${sub.dateOfBirth.slice(4, 6)}/${sub.dateOfBirth.slice(6, 8)}/${sub.dateOfBirth.slice(0, 4)}</div>
              </div>
              <div>
                <div class="box-label">Sex</div>
                <div class="box-value">${sub.gender}</div>
              </div>
            </div>

            <div class="grid-2">
              <div>
                <div class="box-label">5. Patient's Address</div>
                <div class="box-value">${sub.address.address1}, ${sub.address.city}, ${sub.address.state} ${sub.address.postalCode}</div>
              </div>
              <div>
                <div class="box-label">6. Patient Relationship to Insured</div>
                <div class="box-value">${sub.individualRelationshipCode === '18' ? 'Self' : sub.individualRelationshipCode === '01' ? 'Spouse' : 'Child'}</div>
              </div>
            </div>

            <div class="section-title">21. Diagnosis or Nature of Illness / Injury (ICD-10)</div>
            <table>
              <tbody>
                <tr class="dx-row">${dxRows}</tr>
              </tbody>
            </table>

            <div class="section-title">24. Service Lines</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>POS</th>
                  <th>Procedure · Modifier</th>
                  <th>DX Ptr</th>
                  <th>Charge</th>
                  <th>Units</th>
                  <th>Rendering NPI</th>
                </tr>
              </thead>
              <tbody>
                ${lineRows}
                <tr class="total-row">
                  <td colspan="4">28. Total Charge</td>
                  <td>$${c.claimChargeAmount.toFixed(2)}</td>
                  <td colspan="2"></td>
                </tr>
              </tbody>
            </table>

            <div class="grid-2" style="margin-top: 22px;">
              <div>
                <div class="box-label">33. Billing Provider Info</div>
                <div class="box-value">${bill.organizationName ?? '—'}</div>
                <div style="font-size: 11px; color: #666;">
                  ${bill.address.address1}${bill.address.address2 ? `, ${bill.address.address2}` : ''}<br />
                  ${bill.address.city}, ${bill.address.state} ${bill.address.postalCode}
                </div>
              </div>
              <div>
                <div class="box-label">33a. NPI · 25. Tax ID</div>
                <div class="box-value">${bill.npi} · ${bill.employerId}</div>
              </div>
            </div>

            <div class="footer">
              <div>Claim Control #: ${c.patientControlNumber}</div>
              <div>Generated ${new Date().toLocaleString('en-US')}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export function createMockStediService(): MockStediService {
  return new MockStediService();
}
