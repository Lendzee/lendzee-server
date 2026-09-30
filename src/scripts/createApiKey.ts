/**
 * Register an API key for external read access (e.g. the Atlas / HubSpot integration).
 *
 * Usage (from creditapp-be, on Node 18, with .env present):
 *
 *   # Register a specific key (recommended - the one already handed to the integrator):
 *   API_KEY='lz_xxx' API_KEY_LABEL='Atlas - HubSpot integration' ts-node ./src/scripts/createApiKey.ts
 *
 *   # Or let the script mint a fresh key and print it:
 *   ts-node ./src/scripts/createApiKey.ts
 *
 * Env:
 *   API_KEY        Plaintext key to register. If omitted, a new one is generated and printed.
 *   API_KEY_LABEL  Human label. Default: "Atlas - HubSpot integration".
 *   ORG_ID         Organisation the key acts as. If omitted, the first `type: 'admin'`
 *                  (internal) org is used so the key can read ALL evaluations.
 *   PERMISSIONS    Comma-separated scopes. Default: "read:credit-evaluations".
 */
import dotenv from 'dotenv';
import path from 'path';
import moduleAlias from 'module-alias';
import crypto from 'crypto';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const srcDir = path.join(__dirname, '..');
moduleAlias.addAliases({
	helpers: srcDir + '/helpers',
	models: srcDir + '/models',
	controllers: srcDir + '/controllers',
	middlewares: srcDir + '/middlewares',
	utils: srcDir + '/utils',
});

/* eslint-disable @typescript-eslint/no-var-requires */
const ApiKey = require('models/apiKey').default;
const Organisation = require('models/organisation').default;
/* eslint-enable @typescript-eslint/no-var-requires */

const run = async () => {
	await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/creditapp-be');

	const label = process.env.API_KEY_LABEL || 'Atlas - HubSpot integration';
	const permissions = (process.env.PERMISSIONS || 'read:credit-evaluations').split(',').map((p) => p.trim());

	// Resolve the organisation the key authenticates as.
	// An 'admin' (internal) org reads ALL evaluations; a 'partner' org is scoped to its lead source.
	let organisationId = process.env.ORG_ID;
	if (!organisationId) {
		const adminOrg = await Organisation.findOne({ type: 'admin' }).lean();
		if (!adminOrg) {
			throw new Error('No organisation with type "admin" found. Pass ORG_ID=<id> explicitly.');
		}
		organisationId = adminOrg._id.toString();
		console.log(`Using admin organisation: ${adminOrg.name || ''} (${organisationId})`);
	}

	const key = process.env.API_KEY || `lz_${crypto.randomBytes(24).toString('hex')}`;
	const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

	const existing = await ApiKey.findOne({ hashedKey });
	if (existing) {
		console.log(`This key is already registered (id ${existing._id}, active=${existing.active}). Nothing to do.`);
	} else {
		const doc = await ApiKey.create({
			label,
			hashedKey,
			prefix: key.slice(0, 11),
			organisation: organisationId,
			permissions,
			active: true,
		});

		console.log('\nAPI key registered:');
		console.log(`  id:           ${doc._id}`);
		console.log(`  label:        ${label}`);
		console.log(`  organisation: ${organisationId}`);
		console.log(`  permissions:  ${permissions.join(', ')}`);
		console.log(`\n  KEY (give to the integrator, shown once): ${key}\n`);
	}

	await mongoose.disconnect();
};

run().catch(async (err) => {
	console.error(err);
	await mongoose.disconnect().catch(() => undefined);
	process.exit(1);
});
