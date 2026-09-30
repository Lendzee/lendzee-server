import { RolesEnum } from 'models/user';

enum Permissions {
	LOGS_READ = 'read:logs',

	ORGANISATIONS_READ = 'read:organisations',
	ORGANISATIONS_WRITE = 'write:organisations',
	ORGANISATIONS_UPDATE = 'update:organisations',
	ORGANISATIONS_DELETE = 'delete:organisations',

	USERS_READ = 'read:users',
	USERS_WRITE = 'write:users',
	USERS_UPDATE = 'update:users',
	USERS_DELETE = 'delete:users',

	CUSTOMERS_READ = 'read:customers',
	CUSTOMERS_WRITE = 'write:customers',
	CUSTOMERS_UPDATE = 'update:customers',
	CUSTOMERS_DELETE = 'delete:customers',

	CREDIT_EVALUATIONS_READ = 'read:credit-evaluations',
	CREDIT_EVALUATIONS_WRITE = 'write:credit-evaluations',
	CREDIT_EVALUATIONS_UPDATE = 'update:credit-evaluations',
	CREDIT_EVALUATIONS_DELETE = 'delete:credit-evaluations',
	// API-key only: exposes the generated credit-report PDF link on /api/v1.
	CREDIT_REPORTS_READ = 'read:credit-reports',

	LOAN_PACKAGES_READ = 'read:loan-packages',
	LOAN_PACKAGES_WRITE = 'write:loan-packages',
	LOAN_PACKAGES_UPDATE = 'update:loan-packages',
	LOAN_PACKAGES_DELETE = 'delete:loan-packages',
}

export type PermissionsType = `${Permissions}`;

// ADMIN PERMISSIONS

export const rolePermissions: { [x in RolesEnum]: PermissionsType[] } = {
	admin: [
		Permissions.LOGS_READ,

		Permissions.ORGANISATIONS_READ,
		Permissions.ORGANISATIONS_WRITE,
		Permissions.ORGANISATIONS_UPDATE,
		Permissions.ORGANISATIONS_DELETE,

		Permissions.USERS_READ,
		Permissions.USERS_WRITE,
		Permissions.USERS_UPDATE,
		Permissions.USERS_DELETE,

		Permissions.CUSTOMERS_READ,
		Permissions.CUSTOMERS_WRITE,
		Permissions.CUSTOMERS_UPDATE,
		Permissions.CUSTOMERS_DELETE,

		Permissions.CREDIT_EVALUATIONS_READ,
		Permissions.CREDIT_EVALUATIONS_WRITE,
		Permissions.CREDIT_EVALUATIONS_UPDATE,
		Permissions.CREDIT_EVALUATIONS_DELETE,
	],
	'partner-admin': [
		Permissions.USERS_READ,
		Permissions.USERS_WRITE,
		Permissions.USERS_UPDATE,
		Permissions.USERS_DELETE,

		Permissions.CREDIT_EVALUATIONS_READ,
		// Permissions.CUSTOMERS_READ,
		// Permissions.LOAN_PACKAGES_READ,
	],
	partner: [
		Permissions.CREDIT_EVALUATIONS_READ,
		// Permissions.CUSTOMERS_READ,
		// Permissions.LOAN_PACKAGES_READ
	],
	'partner-sales-rep': [
		Permissions.CREDIT_EVALUATIONS_READ,
		// Permissions.CUSTOMERS_READ,
		// Permissions.LOAN_PACKAGES_READ,
	],
};
