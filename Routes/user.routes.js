import express from 'express';
import userService from '../Service/userService.js';
import Middleware from '../Middleware/middleware.js';

export const userRoutes = (router) => {
    const userRouter = express();

    router.use('/users', userRouter);

    userRouter.post('/signup', Middleware.authRequired(), async (req, res, next) => {
        try {
          console.log('req.user:', req.user);
          console.log('req.body:', req.body);
      
          const userdata = { ...req.user, ...req.body };
      
          if (!userdata.displayName) {
            return res.status(400).json({ message: 'displayName is required.' });
          }
      
          const response = await userService.create(userdata);
      
          if (!response) {
            return res.status(400).json({ message: 'Sign up unsuccessful, try again!' });
          }
      
          res.status(201).json({
            msg: 'User signed up successfully',
            data: response,
          });
        } catch (e) {
          console.error('Failed to sign up:', e.message);
          res.status(500).json({
            message: e.message || 'Internal server error',
          });
        }
    });
      

    userRouter.get('/login/:email', Middleware.authRequired(), async (req, res, next) => {
        try {
            const email = req.user.email;

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    message: "Invalid email format"
                });
            }
            const response = await userService.getByEmail(email);
            
            if (!response) {
                return res.status(404).json({
                    message: "User not found"
                });
            }
    
            res.status(200).json({
                message: "Login route successful",
                data: response
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                message: error.message || "Internal server error"
            });
        }
    });

    userRouter.patch('/forget-password/:id', async(req, res, next) => {
        try{
            const id = req.params.id;
            const updateData = req.body;

            const response = await userService.update(id, updateData);

            if(!response){
                return res.status(400).json({
                    message: "Failed to update user details"
                })
            }
            res.status(200).json({
                message: "Update successful",
                "data": response,
            })
        } catch (e) {
            console.log("Fail to update user details: ", e.error);
            res.status(500).json({
                message: e.message
            })
        }
    });

    userRouter.delete('/delete/:id', async (req, res, next) => {
        try{
            const id = req.params.id;

            const response = await userService.delete(id);

            if(!response){
                return res.status(400).json({
                    message: "user can't be delete, try again!"
                })
            }

            res.status(200).json({
                message: `${id} is deleted successfully`,
            })
        } catch (e) {
            console.log('delete fail:', e.error);
            res.status(500).json({
                message: error.message || 'Internal server error'
            })
        }

    });
}
