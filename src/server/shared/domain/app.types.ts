export type Role = 'admin' | 'director' | 'operator';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  workers: number;
}
export interface Convention {
  year: number;
  salaryFloorCents: number;
  dueDay: number;
  monthlyFinePercent: number | null;
}
export interface QuoteInput {
  companyId: string;
  months: string[];
  workers: number;
  dueDate: string;
  overrideCents?: number;
  discountCents: number;
  correctionCents: number;
}
export interface Quote {
  baseCents: number;
  fineCents: number;
  correctionCents: number;
  discountCents: number;
  totalCents: number;
  estimatedWorkers: number;
  overdueMonths: number;
  breakdown: { month: string; baseCents: number; overdue: boolean }[];
}
export interface Bill {
  id: string;
  companyId: string;
  months: string[];
  workers: number;
  dueDate: string;
  totalCents: number;
  createdBy: string;
  createdAt: string;
  status: 'open' | 'paid';
  quote?: Quote;
  notifications: string[];
}
export interface Database {
  version: 1;
  companies: Company[];
  bills: Bill[];
  users: User[];
  conventions: Convention[];
}
export interface MonitorRow {
  company: Company;
  dueCents: number;
  paidCents: number;
  estimatedWorkers: number | null;
  previousWorkers: number | null;
  discrepancy: boolean;
  status: 'paid' | 'open' | 'overdue' | 'missing';
}
export interface Services {
  listCompanies(): Promise<Company[]>;
  saveCompany(company: Company): Promise<Company>;
  lookupCompany(cnpj: string): Promise<Company>;
  monitor(month: string): Promise<MonitorRow[]>;
  listBills(): Promise<Bill[]>;
  quote(input: QuoteInput): Promise<Quote>;
  issue(input: QuoteInput): Promise<Bill>;
  pay(id: string): Promise<void>;
  listUsers(): Promise<User[]>;
  saveUser(user: User): Promise<User>;
  conventions(): Promise<Convention[]>;
  saveConvention(convention: Convention): Promise<void>;
}
