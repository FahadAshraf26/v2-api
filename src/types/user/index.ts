export interface UserModelAttributes {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  // Add other user model attributes here
}

export interface UserProps extends UserModelAttributes {}
