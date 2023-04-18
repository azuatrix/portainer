package ssl

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "ssl"
	key        = "SSL"
)

// Service represents a service for managing ssl data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// Settings retrieve the ssl settings object.
func (service *Service) Settings() (*portainer.SSLSettings, error) {
	var settings portainer.SSLSettings

	return &settings, nil
}

// UpdateSettings persists a SSLSettings object.
func (service *Service) UpdateSettings(settings *portainer.SSLSettings) error {
	// return service.connection.UpdateObject(BucketName, []byte(key), settings)
	return nil
}
