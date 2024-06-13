const JWT = require('jsonwebtoken');

const generateToken = (payload: any) => {
  const expiresIn = '15d';
  const algorithm = 'HS256';

  return JWT.sign(
    {
      iat: Math.floor(Date.now() / 1000),
      ...payload,
      algorithm,
    },
    process.env.SECRET,
    {
      expiresIn,
    },
  );
};

const generateRefreshToken = (payload: any) => {
  const expiresIn = '365d';

  return JWT.sign(
    {
      id: payload,
    },
    process.env.SECRET,
    {
      expiresIn,
    },
  );
};

export { generateToken, generateRefreshToken };
