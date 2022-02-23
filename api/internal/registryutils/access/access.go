package access

import (
	"fmt"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/dataservices/registry"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
)

func hasPermission(
	dataStore dataservices.DataStore,
	userID database.UserID,
	endpointID database.EndpointID,
	registry *registry.Registry,
) (hasPermission bool, err error) {
	user, err := dataStore.User().User(userID)
	if err != nil {
		return
	}

	if user.Role == portainer.AdministratorRole {
		return true, err
	}

	teamMemberships, err := dataStore.TeamMembership().TeamMembershipsByUserID(userID)
	if err != nil {
		return
	}

	hasPermission = security.AuthorizedRegistryAccess(registry, user, teamMemberships, endpointID)

	return
}

// GetAccessibleRegistry get the registry if the user has permission
func GetAccessibleRegistry(
	dataStore dataservices.DataStore,
	userID database.UserID,
	endpointID database.EndpointID,
	registryID registry.RegistryID,
) (registry *registry.Registry, err error) {

	registry, err = dataStore.Registry().Registry(registryID)
	if err != nil {
		return
	}

	hasPermission, err := hasPermission(dataStore, userID, endpointID, registry)
	if err != nil {
		return
	}

	if !hasPermission {
		err = fmt.Errorf("user does not has permission to get the registry")
		return nil, err
	}

	return
}