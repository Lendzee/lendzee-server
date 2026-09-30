// import { LeanDocument } from "mongoose";
// import { IOrganisation } from "models/organisation";

declare namespace Express {
	interface Request {
		auth: {
			id: string;
			organisation: LeanDocument<IOrganisation> | undefined;
			// Set by apiKeyAuth only: the scopes granted to the calling key.
			permissions?: string[];
		};
	}
}
