import express from 'express';
import userService from '../../service/user/userService.js'


export const userRoutes = (router) => {
    const userRouter = express();

    router.use('/user', userRouter);

    userRouter.post('/signup', async (req, res, next) => {
        const userdata = req.body;
        const response = await userService.create(userdata)
        const data = response
        res.status(200).json({
            "msg": "hitting signup route",
            "data" : data
        })
    });

    userRouter.get('/login/:email', async (req, res, next) => {
        try {
            const email = req.params.email;

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

    userRouter.put('/forget-password', (req, res, next) => {
        res.status(200).json({"msg": "hitting reset password route"})

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
                message: `${response.id} is deleted successfully`,
            })
        } catch (e) {
            console.log('delete fail:', e.error);
            res.status(500).json({
                message: error.message || 'Internal server error'
            })
        }

    });
}