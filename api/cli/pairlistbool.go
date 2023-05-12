package cli

import (
	"strings"

	portainer "github.com/portainer/portainer/api"

	"gopkg.in/alecthomas/kingpin.v2"
)

type pairListBool portainer.MultiPair

// Set implementation for a list of portainer.Pair
func (l *pairListBool) Set(value string) error {
	p := new(portainer.Pair)

	// default to true.  example setting=true is equivalent to setting
	parts := strings.SplitN(value, "=", 2)
	if len(parts) != 2 {
		p.Name = parts[0]
		p.Value1 = "true"
	} else {
		p.Name = parts[0]
		p.Value1 = parts[1]
	}

	*l = append(*l, *p)
	return nil
}

// String implementation for a list of pair
func (l *pairListBool) String() string {
	return ""
}

// IsCumulative implementation for a list of pair
func (l *pairListBool) IsCumulative() bool {
	return true
}

func BoolPairs(s kingpin.Settings) (target *portainer.MultiPair) {
	target = new(portainer.MultiPair)
	s.SetValue((*pairListBool)(target))
	return
}
