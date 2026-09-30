import { RequestHandler } from 'express';
import crypto from 'crypto';
import { LeanDocument } from 'mongoose';

import i18n from 'helpers/i18n';
import ApiKey from 'models/apiKey';
import Organisation, { IOrganisation } from 'models/organisation';
import { PermissionsType } from 'helpers/permissions';

const hashKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

// Authenticates external integrations (e.g. a HubSpot workflow) via the `x-api-key` header.
// Deliberately separate from `auth` (user JWTs): API keys only ever reach the /api/v1 surface,
// never the internal app routes.
const apiKeyAuth: (permissions: PermissionsType[]) => RequestHandler = (permissions) => async (req, res, next) => {
	try {
		const apiKeyHeader = req.headers['x-api-key'];

		if (!apiKeyHeader) {
			return res.status(401).json({ message: i18n.__('MIDDLEWARE.AUTH.MISSING_TOKEN') });
		}

		const rawKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
		const apiKey = await ApiKey.findOne({ hashedKey: hashKey(rawKey), active: true });

		if (!apiKey) {
			return res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
		}

		const missingScope = permissions.some((permission) => !apiKey.permissions.includes(permission));
		if (missingScope) {
			return res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
		}

		const organisation = (await Organisation.findById(apiKey.organisation).lean()) as LeanDocument<IOrganisation>;

		// Best-effort audit trail; never block the request on it.
		ApiKey.findByIdAndUpdate(apiKey._id, { lastUsedAt: new Date() }).catch(() => undefined);

		req.auth = {
			id: apiKey._id.toString(),
			organisation,
			permissions: apiKey.permissions,
		};

		next();
	} catch (err) {
		res.status(500).json({ message: i18n.__('GLOBAL.ERROR.NETWORK') });
	}
};

export default apiKeyAuth;
