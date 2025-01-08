declare namespace Express {
    export interface Request {
      user?: {
        id?:string;
        companyId?: string;
        role?: string;
        employeeId?:string;
        permissions?: Array<{
          id: string;
          action: string;
          resource: string;
          roleId: string;
          companyId: string;
        }>;
      };
    }
  }
  
