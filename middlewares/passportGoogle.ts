import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Customer } from '../entities/customer.entity';
import { AppDataSource } from '../data-source';
const repository = AppDataSource.getRepository(Customer);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.SERVER_URL}/user/auth/google/callback`,
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
