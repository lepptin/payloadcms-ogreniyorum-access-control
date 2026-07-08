import { Access, AccessResult } from "payload";

export const createAccessBooleanSample:Access = ({req}):AccessResult=>{
    if (req?.user && req.user.role === 'admin') {
        return true;
      }
      return false;
}