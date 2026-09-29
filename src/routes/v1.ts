import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCreditEvaluations as getCreditEvaluationsController,
	getCreditEvaluation as getCreditEvaluationController,
	getCreditEvaluationForHubSpotRepair as getCreditEvaluationForHubSpotRepairController,
} from 'controllers/v1';
import apiKeyAuth from 'middlewares/apiKeyAuth';

// External, API-key-authenticated surface. Mounted at /api/v1.
// These routes use `apiKeyAuth` (x-api-key) instead of the user-JWT `auth` middleware,
// so internal app routes stay off-limits to integration keys.
const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/credit-evaluations',
		middlewares: [apiKeyAuth(['read:credit-evaluations'])],
		controller: getCreditEvaluationsController,
	},
	{
		method: 'get',
		route: '/credit-evaluations/:id',
		middlewares: [apiKeyAuth(['read:credit-evaluations'])],
		controller: getCreditEvaluationController,
	},
	{
		method: 'get',
		route: '/credit-evaluations/:id/hubspot-repair',
		middlewares: [apiKeyAuth(['read:credit-evaluations'])],
		controller: getCreditEvaluationForHubSpotRepairController,
	},
]);

export default router;
