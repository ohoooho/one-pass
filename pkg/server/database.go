package server

import (
	"errors"

	"github.com/ohoooho/one-pass/pkg/onepass"
)

// ErrKeyNotFound is returned by Update when the key does not exist or is
// deleted before the write commits.
var ErrKeyNotFound = errors.New("key not found")

// Database interface
type Database interface {
	Get(key string) (onepass.Secret, error)
	Put(key string, secret onepass.Secret) error
	Delete(key string) (bool, error)
	Status(key string) (onepass.Secret, error)
	// Update atomically applies fn to the current value at key and stores the
	// result with the returned secret's expiration. The read-modify-write is
	// atomic across processes sharing the backend; implementations retry
	// internally on contention. If fn returns an error the update is aborted
	// and that error is returned unchanged.
	Update(key string, fn func(onepass.Secret) (onepass.Secret, error)) error
	Health() error
}
