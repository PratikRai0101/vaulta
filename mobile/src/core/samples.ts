import { hashHex } from './crypto';
import type { VaultItem } from './types';

const encoder = new TextEncoder();
export function samplePdf(title: string): Uint8Array {
  const escape = (value: string) => value.replace(/[\\()]/g, '\\$&');
  const lines = [title, 'VAULTA DESIGN SAMPLE', 'Pratik Rai', '09-13 November 2026', 'Synthetic example. Not a valid credential or insurance policy.'];
  const stream = `BT /F1 18 Tf 50 770 Td ${lines.map((line, i) => `${i ? '0 -32 Td ' : ''}(${escape(line)}) Tj`).join('\n')} ET`;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return encoder.encode(pdf);
}
const flightFields = {
  airline: 'Auric Air', flight: 'AX 247', from: 'BLR', to: 'GOI', fromCity: 'Bengaluru', toCity: 'Goa',
  date: '09 Nov 2026', boarding: '18:20', departure: '18:45', gate: '08', seat: '12A', passenger: 'Pratik Rai', booking: 'N7R4K2',
  code: 'VAULTA DESIGN SAMPLE. NOT VALID FOR TRAVEL.', sample: 'true',
};
export function makeSample(id: string, category: VaultItem['category'], title: string, fields: Record<string, string>): { item: VaultItem; bytes: Uint8Array } {
  const bytes = category === 'document' ? samplePdf(title) : encoder.encode(JSON.stringify({ type: 'vaulta-sample', title, fields }));
  return { item: { id, title, category, mimeType: category === 'document' ? 'application/pdf' : 'application/json', size: bytes.length, createdAt: '2026-11-08T14:00:00.000Z', contentHash: hashHex(bytes), fields }, bytes };
}
export const travelSample = (id: string) => makeSample(id, 'travel', 'Goa, tomorrow', flightFields);
export const previewItems: VaultItem[] = [
  travelSample('b44b6be1-7cae-4d86-83c2-000000000001').item,
  makeSample('b44b6be1-7cae-4d86-83c2-000000000002', 'membership', 'Aster Club', { clubName: 'Aster Club', memberName: 'Pratik Rai', memberId: '0098', code: 'VAULTA MEMBERSHIP SAMPLE', sample: 'true' }).item,
  makeSample('b44b6be1-7cae-4d86-83c2-000000000003', 'ticket', 'The Grand', { title: 'Dune: Part Two', date: '11 Nov', time: '20:10', seat: 'H08', code: 'VAULTA CINEMA SAMPLE', sample: 'true' }).item,
  ...['Travel insurance', 'Hotel confirmation', 'Identity sample'].map((title, i) => makeSample(`b44b6be1-7cae-4d86-83c2-00000000000${i + 4}`, 'document', title, { sample: 'true' }).item),
];
