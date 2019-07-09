import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Model from '../db/index';
import Authorization from '../middlewares/Authorization.middleware';


dotenv.config();
const users = new Model('users');

/**
 * @class AuthController
 */
export default class AuthController {
  /**
   * @method signUp
   *
   * @param {object} req
   * @param {object} res
   *
   * @returns {object} status code, data and message properties
   */
  static async signup(req, res) {
    const {
      firstname, lastname, email, password
    } = req.body;

    const existingUser = await users.select(['email'], [`email='${email}'`]);

    if (existingUser.length > 0) {
      return res.status(409).json({
        status: 409,
        error: 'User already exists'
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const [newUser] = await users.create(
      ['firstname', 'lastname', 'email', 'password', 'is_admin'],
      [`'${firstname}', '${lastname}', '${email}', '${hashedPassword}', false`]
    );

    const payload = {
      id: newUser.id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      is_admin: newUser.is_admin
    };

    const token = Authorization.generateToken(payload);

    delete newUser.password;

    const data = {
      ...newUser,
      token,
    };
    return res.status(201).json({
      status: 'success',
      data,
      message: 'User registered successfully'
    });
  }

  /**
   * @method signin
   *
   * @param {object} req request
   * @param {object} res response
   *
   * @returns {object}  status code, data and message properties
   */
  static async signin(req, res) {
    const { password, email } = req.body;
    const findUser = await users.select(['*'], `email='${email}'`);

    if (findUser.length > 0) {
      const verifyUserPassword = bcrypt.compareSync(password, findUser[0].password);

      if (!verifyUserPassword) {
        return res.status(401).json({
          status: 401,
          error: 'Email or password is incorrect'

        });
      }

      const payload = {
        id: findUser[0].id,
        firstname: findUser[0].firstname,
        lastname: findUser[0].lastname,
        email: findUser[0].email,
        is_admin: findUser[0].is_admin
      };

      const token = Authorization.generateToken(payload);

      const data = {
        id: findUser[0].id,
        firstname: findUser[0].firstname,
        lastname: findUser[0].lastname,
        email: findUser[0].email,
        is_admin: findUser[0].is_admin,
        token
      };

      return res.status(200).json({
        status: 'success',
        data,
        message: 'Login successful'
      });
    }
    return res.status(401).json({
      status: 401,
      error: 'Email or password is incorrect'
    });
  }
}
