import { Access, AccessResult } from "payload";

// DELETE: Sadece kendi notlarını silebilir
export const deleteAccessQuerySample:Access = ({req}):AccessResult=>{
    if (!req.user) return false
      return { owner: { equals: req.user.id } }
}