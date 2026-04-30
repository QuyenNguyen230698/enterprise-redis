const Role = require('../models/roleModel')
const Permission = require('../models/permissionModel')

const initializeRoles = async () => {
  const roles = [
    {
      name: 'Admin',
      permissions: ['view_users', 'create_users', 'assign_roles', 'view_content', 'create_content'],
    },
    {
      name: 'Employeer',
      permissions: ['view_content'],
    },
    {
      name: 'Manager',
      permissions: ['view_users', 'view_content'],
    },
    {
      name: 'Creator',
      permissions: ['create_content', 'view_content'],
    },
  ]

  for (const role of roles) {
    const roleExists = await Role.findOne({ name: role.name })
    if (!roleExists) {
      const permissions = await Promise.all(
        role.permissions.map(async (permissionName) => {
          let permission = await Permission.findOne({ name: permissionName })
          if (!permission) {
            permission = new Permission({ name: permissionName, description: `Permission to ${permissionName}` })
            await permission.save()
          }
          return permission
        })
      )

      const newRole = new Role({ name: role.name, permissions })
      await newRole.save()
    }
  }
}

module.exports = initializeRoles
