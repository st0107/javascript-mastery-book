'use strict';

function canAccessBeta(user, feature) {
  return Boolean(
    user?.active &&
      feature?.enabled &&
      (user.role === 'staff' || feature.allowedUserIds.includes(user.id))
  );
}

console.log(canAccessBeta({ id: 'u1', active: true, role: 'member' }, {
  enabled: true,
  allowedUserIds: ['u1']
}));
