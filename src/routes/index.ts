import { Router, Application } from 'express';

import authRoute from './auth.routes';

export default function routeHandler(app: Application) {
    const router = Router();
    app.use('/api/v1', router);

    router.use('/auth', authRoute);
}
 