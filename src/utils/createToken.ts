import jwt from "jsonwebtoken";
export const createToken = (user: any, secretKey: any, expiryTime: any) => {
  return jwt.sign(user, secretKey, {
    expiresIn: expiryTime,
  });
};

export function verify(token: string, secret: string): any {
  return jwt.verify(token, secret);
}