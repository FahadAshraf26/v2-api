export interface ORMDataTypes {
  UUID: any;
  STRING: (length?: number) => any;
  TEXT: any;
  BOOLEAN: any;
  DATE: any;
  DATEONLY: any;
  INTEGER: any;
  FLOAT: any;
  JSON: any;
}

export interface ORMModelAttributes {
  [key: string]: any;
}

export interface ORMTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
