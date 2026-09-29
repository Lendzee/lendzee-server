import { RequestHandler } from 'express';
import { FilterQuery, LeanDocument } from 'mongoose';

import i18n from 'helpers/i18n';
import CreditEvaluation, { ICreditEvaluation } from 'models/creditEvaluation';
import Customer from 'models/customer';

type LeanCreditEvaluation = LeanDocument<ICreditEvaluation> & { createdAt?: Date; updatedAt?: Date };

// Curated external representation. Deliberately omits sensitive/internal fields
// (raw credit-report `html`/`pdf`, underwriter `notes`, the internal `customer` ref).
const serializeCreditEvaluation = (creditEvaluation: LeanCreditEvaluation) => ({
	id: creditEvaluation._id,
	hubspotDealId: creditEvaluation.hubspotDealId,
	leadSource: creditEvaluation.leadSource,
	state: creditEvaluation.state,
	reportDate: creditEvaluation.reportDate,
	createdAt: creditEvaluation.createdAt,
	updatedAt: creditEvaluation.updatedAt,

	affordability: creditEvaluation.affordability,
	dealStatus: creditEvaluation.dealStatus,
	loanPackageAmount: creditEvaluation.loanPackageAmount,
	statedMonthlyIncome: creditEvaluation.statedMonthlyIncome,
	loanAffordabilityRate: creditEvaluation.loanAffordabilityRate,
	averageMonthsOfOpenRevolvingCredit: creditEvaluation.averageMonthsOfOpenRevolvingCredit,
	ageOfFile: creditEvaluation.ageOfFile,

	creditScores: creditEvaluation.creditScores,
	declineReasonCodes: creditEvaluation.declineReasonCodes,

	debtDetails: creditEvaluation.debtDetails,
	incomesOverview: creditEvaluation.incomesOverview,
	loanAffordability: creditEvaluation.loanAffordability,

	// Account-level data - Atlas reads these to find open mortgage-like debts.
	// Same shape the frontend already consumes as `data.tradelines` / `data.loans`.
	tradelines: creditEvaluation.tradelines,
	loans: creditEvaluation.loans,

	recentInquiries: creditEvaluation.recentInquiries?.map((inquiry) => ({
		type: inquiry.type,
		lastSixMonths: inquiry.lastSixMonths,
		lastTwelveMonths: inquiry.lastTwelveMonths,
	})),

	summary: {
		tradelines: creditEvaluation.tradelines?.length ?? 0,
		openTradelines: creditEvaluation.tradelines?.filter((tradeline) => tradeline.status === 'opened').length ?? 0,
		loans: creditEvaluation.loans?.length ?? 0,
		collections: creditEvaluation.collections?.length ?? 0,
		publicRecords: creditEvaluation.publicRecords?.length ?? 0,
		chargeOffs: creditEvaluation.chargeOffs?.length ?? 0,
		latePayments: creditEvaluation.latePayments?.length ?? 0,
	},
});

export const getCreditEvaluations: RequestHandler = async (req, res, next) => {
	try {
		const { organisation } = req.auth;

		if (!organisation) {
			return res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
		}

		// Partner-scoped keys only see their own lead source; internal keys see everything.
		const filters: FilterQuery<ICreditEvaluation> = {};
		if (organisation.type === 'partner') {
			filters.leadSource = { $exists: true, $eq: organisation.leadSource };
		}
		// Atlas lives in HubSpot - allow lookup by the associated deal id (?hubspotDealId=...).
		if (req.query.hubspotDealId) {
			filters.hubspotDealId = String(req.query.hubspotDealId);
		}

		const creditEvaluations = (await CreditEvaluation.find(filters)
			.select('-html -pdf -notes')
			.sort({ createdAt: -1 })
			.lean()) as LeanCreditEvaluation[];

		res.json({ data: creditEvaluations.map(serializeCreditEvaluation) });
	} catch (err) {
		next(err);
	}
};

export const getCreditEvaluation: RequestHandler = async (req, res, next) => {
	try {
		const { organisation } = req.auth;
		const { id } = req.params;

		if (!organisation) {
			return res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
		}

		const creditEvaluation = (await CreditEvaluation.findById(id)
			.select('-html -pdf -notes')
			.lean()) as LeanCreditEvaluation | null;

		if (!creditEvaluation) {
			return res.status(404).json({ message: 'Credit evaluation not found.' });
		}

		// A partner key may only read evaluations from its own lead source.
		if (organisation.type === 'partner' && creditEvaluation.leadSource !== organisation.leadSource) {
			return res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
		}

		res.json({ data: serializeCreditEvaluation(creditEvaluation) });
	} catch (err) {
		next(err);
	}
};

// Narrow read surface for HubSpot's credit-result repair workflow. The ordinary
// external representation deliberately omits report links; only an admin
// organisation API key may retrieve them here. No credit pull is performed.
export const getCreditEvaluationForHubSpotRepair: RequestHandler = async (req, res, next) => {
	try {
		if (req.auth.organisation?.type !== 'admin') {
			return res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
		}

		const creditEvaluation = await CreditEvaluation.findById(req.params.id)
			.select('customer hubspotDealId html pdf reportDate creditScores declineReasonCodes')
			.lean();
		if (!creditEvaluation) {
			return res.status(404).json({ message: 'Credit evaluation not found.' });
		}

		const customer = creditEvaluation.customer
			? await Customer.findById(creditEvaluation.customer).select('hubspotId').lean()
			: null;

		res.json({
			data: {
				id: creditEvaluation._id,
				hubspotDealId: creditEvaluation.hubspotDealId,
				hubspotContactId: customer?.hubspotId,
				customerId: customer?._id,
				reportDate: creditEvaluation.reportDate,
				html: creditEvaluation.html,
				pdf: creditEvaluation.pdf,
				creditScores: creditEvaluation.creditScores,
				declineReasonCodes: creditEvaluation.declineReasonCodes,
			},
		});
	} catch (err) {
		next(err);
	}
};
