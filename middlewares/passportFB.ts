import passport from 'passport';
import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';

import { Customer } from '../entities/customer.entity';
import { AppDataSource } from '../data-source';
const repository = AppDataSource.getRepository(Customer);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: 'http://localhost:9000/user/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'name', 'photos', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, cb: Function) => {
      try {
        let user = await repository.findOneBy({ email: profile.emails![0].value });
        if (!user) {
          const newCustomer = repository.create({
            firstName: profile.name!.givenName,
            lastName: profile.name!.familyName,
            email: profile.emails![0].value,
            photo: profile.photos![0].value,
          });
          const savedCustomer = await repository.save(newCustomer);
          return cb(null, savedCustomer);
        } else {
          return cb(null, user);
        }
      } catch (error) {
        return cb(error);
      }
    },
  ),
);

export default passport;
