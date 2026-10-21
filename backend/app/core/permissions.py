import enum
from typing import Set
from app.models.user import UserRole


class Permission(str, enum.Enum):
    VIEW_USERS = "VIEW_USERS"
    CREATE_ONBOARDING = "CREATE_ONBOARDING"
    REVIEW_ONBOARDING = "REVIEW_ONBOARDING"
    CHANGE_ACCOUNT_STATUS = "CHANGE_ACCOUNT_STATUS"
    ASSIGN_DISTRIBUTOR = "ASSIGN_DISTRIBUTOR"
    MODIFY_PROFILES = "MODIFY_PROFILES"
    ACCESS_REPORTS = "ACCESS_REPORTS"
    INITIATE_PAYMENT = "INITIATE_PAYMENT"
    VIEW_LEDGER = "VIEW_LEDGER"
    MANAGE_REFUNDS = "MANAGE_REFUNDS"
    RECONCILE_PAYMENTS = "RECONCILE_PAYMENTS"
    MANAGE_BANKING_API = "MANAGE_BANKING_API"
    MANAGE_AI = "MANAGE_AI"


# Explicit Role-to-Permissions Mapping (Strict Principle of Least Privilege)
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {
        Permission.VIEW_USERS,
        Permission.CREATE_ONBOARDING,
        Permission.REVIEW_ONBOARDING,
        Permission.CHANGE_ACCOUNT_STATUS,
        Permission.ASSIGN_DISTRIBUTOR,
        Permission.MODIFY_PROFILES,
        Permission.ACCESS_REPORTS,
        Permission.INITIATE_PAYMENT,
        Permission.VIEW_LEDGER,
        Permission.MANAGE_REFUNDS,
        Permission.RECONCILE_PAYMENTS,
        Permission.MANAGE_BANKING_API,
        Permission.MANAGE_AI,
    },
    UserRole.SUPER_DISTRIBUTOR: {
        Permission.VIEW_USERS,
        Permission.CREATE_ONBOARDING,
        Permission.REVIEW_ONBOARDING,
        Permission.MODIFY_PROFILES,
        Permission.ACCESS_REPORTS,
        Permission.INITIATE_PAYMENT,
        Permission.VIEW_LEDGER,
    },
    UserRole.AREA_DISTRIBUTOR: {
        Permission.VIEW_USERS,
        Permission.CREATE_ONBOARDING,
        Permission.MODIFY_PROFILES,
        Permission.ACCESS_REPORTS,
        Permission.INITIATE_PAYMENT,
        Permission.VIEW_LEDGER,
    },
    UserRole.RETAILER: {
        Permission.VIEW_USERS,
        Permission.ACCESS_REPORTS,
        Permission.INITIATE_PAYMENT,
        Permission.VIEW_LEDGER,
    },
}


def get_permissions_for_role(role: UserRole) -> Set[Permission]:
    """Returns the set of authorized permissions granted to a given role."""
    return ROLE_PERMISSIONS.get(role, set())


def has_permission(role: UserRole, permission: Permission) -> bool:
    """Checks whether a given business role possesses an explicit permission."""
    return permission in get_permissions_for_role(role)
