import AuthService from '../../../src/services/auth';
import bcrypt from 'bcrypt';
import Util from 'util';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import config from 'config';

const hashAsync = Util.promisify(bcrypt.hash);

describe('Service: Auth', () => {
  context('authenticate', () => {
    it('should authenticate a user', () => {
      const fakeUserModel = {
        findOne: sinon.stub()
      };
      const user = {
        name: 'John',
        email: 'jhondoe@mail.com',
        password: '12345'
      };
      const userFromDatabase = {
        name: user.name,
        email: user.email,
        password: 'will_be_replaced'
      };

      const authService = new AuthService(fakeUserModel);
      return hashAsync('12345', 10)
        .then(hashedPassword => {
          userFromDatabase.password = hashedPassword;
          fakeUserModel.findOne.withArgs({ email: 'jhondoe@mail.com' }).resolves(userFromDatabase);
          return authService.authenticate(user);
        })
        .then(user => {
          expect(user).to.eql(userFromDatabase);
        });
    });

    it('should return false when the password does not match', () => {
      const user = {
        email: 'jhondoe@mail.com',
        password: '12345'
      };
      const fakeUserModel = {
        findOne: sinon.stub()
      };
      fakeUserModel.findOne.resolves({ email: user.email, password: 'aFakeHashedPassword' });
      const authService = new AuthService(fakeUserModel);
      return authService.authenticate(user)
        .then(response => expect(response).to.be.false);
    });
  });
  context('generateToken', () => {
    it('should generate a JWT token from a payload', () => {
      const payload = {
        name: 'John',
        email: 'jhondoe@mail.com',
        password: '12345'
      };
      const expectedToken = jwt.sign(payload, config.get('auth.key'), {
        expiresIn: config.get('auth.tokenExpiresIn')
      });
      const generatedToken = AuthService.generateToken(payload);
      expect(generatedToken).to.eql(expectedToken);
    });
  });
});
