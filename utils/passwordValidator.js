import validator from 'validator';

export const passwordValidator = (pass) => {
    if(!validator.isStrongPassword(pass)) {
        return { code: 400, success: false, message: 'Password is not strong enough' };
    }   
}