import { Access, AccessResult } from "payload";

export const deleteAccessBooleanSample:Access = ({req}):AccessResult=>{
    if (req?.user && req?.user.role === 'admin') {
        return true;
      }
      return false;
}