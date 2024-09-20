import { UserDocument } from '../models/user.model';
import { DiveLogDocument } from '../models/dive.log.model';
import { isSuperAdmin, isAdmin, isBasicLevelUser } from './role.helper';

// Is the user the owner of the log?
function userOwnsTheLog(currentUser: UserDocument, diveLog: DiveLogDocument): boolean {
  const diveLogUser = diveLog.user as unknown as UserDocument;

  return currentUser?._id.toString() === diveLogUser?._id.toString();
}

// Does the user has access to this log?
function isUserAllowedToAccessLog(currentUser: UserDocument, diveLog: DiveLogDocument): boolean {
  if (!currentUser || !diveLog) {
    return false;
  }

  const usersOwnLog = userOwnsTheLog(currentUser, diveLog);
  const diveLogUser = diveLog.user as unknown as UserDocument;

  let allowedToAccess = false;

  if (isSuperAdmin(currentUser)) {
    allowedToAccess = true; // Super admin can get any log
  } else if (isAdmin(currentUser) && !diveLog?.user) {
    allowedToAccess = true; // Admin can get logs where user is null
  } else if (isAdmin(currentUser) && isBasicLevelUser(diveLogUser)) {
    allowedToAccess = true; // Admin can get any basic user log
  } else if (isAdmin(currentUser) && usersOwnLog) {
    allowedToAccess = true; // Admin can get their own logs
  } else if (isBasicLevelUser(currentUser) && usersOwnLog) {
    allowedToAccess = true; // Basic user can get only their own logs
  }

  return allowedToAccess;
}

export { isUserAllowedToAccessLog };
