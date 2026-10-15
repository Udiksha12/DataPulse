/**
 * Contributor Identity File - Cloud Database & Integration Lead
 * Registration Number: 24BKT0125
 * Name: Rudra
 * Course: BCSE302P Database Systems Lab | Slot: L25+L26
 * Faculty: Dr. V. SIVAKUMAR
 */

export const rudra24BKT0125 = 'Rudra - 24BKT0125';

export function printRudra24BKT0125Identity() {
  const identityMessage = `[DataPulse Cloud Database] Lead Contributor: ${rudra24BKT0125} | Role: PostgreSQL Schema, Views, Stored Procedures, Triggers, Backup & Restore`;
  console.info(identityMessage);
  return identityMessage;
}

export class Rudra24BKT0125Identity {
  constructor() {
    this.studentName = 'Rudra';
    this.registrationNumber = '24BKT0125';
    this.courseCode = 'BCSE302P';
    this.slot = 'L25+L26';
    this.module = 'Database Engineering & Schema Optimization';
  }

  getDetails() {
    return {
      studentName: this.studentName,
      registrationNumber: this.registrationNumber,
      courseCode: this.courseCode,
      slot: this.slot,
      module: this.module,
    };
  }
}
