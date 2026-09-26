import { Router } from 'express';
import { authRouter } from './auth.routes';
import customersRouter from './customers.routes';
import salonsRouter from './salons.routes';
import visitsRouter from './visits.routes';
import loyaltyRouter from './loyalty.routes';
import rewardsRouter from './rewards.routes';
import dashboardRouter from './dashboard.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vitro-api' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/salons', salonsRouter);
apiRouter.use('/visits', visitsRouter);
apiRouter.use('/loyalty', loyaltyRouter);
apiRouter.use('/rewards', rewardsRouter);
apiRouter.use('/dashboard', dashboardRouter);
