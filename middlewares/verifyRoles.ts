const JWT = require('jsonwebtoken');

export const allowRoles = (...required_roles: any) => {
  return (request: any, response: any, next: any) => {
    // next();
    const bearerToken = request.get('Authorization')?.replace('Bearer ', '');
    if (!bearerToken) {
      return response.status(403).json({ message: 'Forbidden' });
    }
    const payload = JWT.decode(bearerToken, { json: true });
    const { roleCode } = payload;
    if (required_roles.includes(roleCode)) {
      next();
    } else {
      response.status(403).json({ message: 'Forbidden' });
    }
  };
};
