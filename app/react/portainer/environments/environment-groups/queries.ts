import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { EnvironmentGroup, EnvironmentGroupId } from './types';
import { getGroup, getGroups } from './environment-groups.service';
import { queryKeys } from './queries/query-keys';

export function useGroups<T = EnvironmentGroup[]>({
  select,
}: { select?: (group: EnvironmentGroup[]) => T } = {}) {
  return useQuery(queryKeys.base(), getGroups, {
    select,
  });
}

export function useGroup<T = EnvironmentGroup>(
  groupId: EnvironmentGroupId,
  select?: (group: EnvironmentGroup) => T
) {
  const { data } = useQuery(queryKeys.group(groupId), () => getGroup(groupId), {
    staleTime: 50,
    select,
    onError(error) {
      notifyError('Failed loading group', error as Error);
    },
  });

  return data;
}
