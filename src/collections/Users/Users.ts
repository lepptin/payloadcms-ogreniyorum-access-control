import type { CollectionConfig, Access } from 'payload'

//Koleksiyon düzeyi access control boolen donus ornegi
import { readAccessBooleanSample } from './Access/readAccessBooleanSample'
import { createAccessBooleanSample } from './Access/createAccessBooleanSample'
import { updateAccessBooleanSample } from './Access/updateAccessBooleanSample'
import { deleteAccessBooleanSample } from './Access/deleteAccessBooleanSample'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },

  //Koleksiyon düzeyi access control boolean dönüş örneği
  access: {
    read: readAccessBooleanSample,
    create: createAccessBooleanSample,
    update: updateAccessBooleanSample,
    delete: deleteAccessBooleanSample,
    
  },

  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'editor', 'author'],
      defaultValue: 'author',
      required: true,
    },
  ],
}
