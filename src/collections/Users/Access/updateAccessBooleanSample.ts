import { Access, AccessResult } from "payload";

export const updateAccessBooleanSample:Access = ({req, id}):AccessResult=>{
    if (req?.user && (req.user.role === 'admin' || req.user.id === id  )) {
        return true;
      }
      return false;
}