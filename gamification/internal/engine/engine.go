
package engine

import (
	"errors"
	"time"
)

const XPPerLevel = 100

type State struct {
	XP                int    `json:"xp"`
	Level             int    `json:"level"`
	CurrentStreak     int    `json:"currentStreak"`
	LongestStreak     int    `json:"longestStreak"`
	LastActivityDate  string `json:"lastActivityDate,omitempty"`
}

type AwardRequest struct {
	CurrentXP             int    `json:"currentXP"`
	CurrentStreak         int    `json:"currentStreak"`
	LongestStreak         int    `json:"longestStreak"`
	LastActivityDate      string `json:"lastActivityDate,omitempty"`
	XPReward              int    `json:"xpReward"`
	ActivityDate          string `json:"activityDate"`
}

func Calculate(req AwardRequest) (State, error) {
	if req.CurrentXP < 0 ||
		req.CurrentStreak < 0 ||
		req.LongestStreak < 0 ||
		req.XPReward < 0 {
		return State{}, errors.New("XP and streak values cannot be negative")
	}

	if req.CurrentStreak > req.LongestStreak {
		return State{}, errors.New("current streak cannot exceed longest streak")
	}

	activityDate, err := time.Parse("2006-01-02", req.ActivityDate)
	if err != nil {
		return State{}, errors.New("activityDate must use YYYY-MM-DD")
	}

	activityDate = activityDate.UTC()

	state := State{
		XP:            req.CurrentXP,
		CurrentStreak: req.CurrentStreak,
		LongestStreak: req.LongestStreak,
	}

	if req.LastActivityDate != "" {
		lastDate, err := time.Parse("2006-01-02", req.LastActivityDate)
		if err != nil {
			return State{}, errors.New("lastActivityDate must use YYYY-MM-DD")
		}

		lastDate = lastDate.UTC()

		if activityDate.Before(lastDate) {
			return State{}, errors.New("activityDate cannot precede last activity")
		}

		days := int(activityDate.Sub(lastDate).Hours() / 24)

		switch {
		case days == 0:
			// Multiple lessons on the same day do not extend a streak.
		case days == 1:
			state.CurrentStreak++
		default:
			state.CurrentStreak = 1
		}
	} else {
		state.CurrentStreak = 1
	}

	state.XP += req.XPReward

	state.Level = (state.XP / XPPerLevel) + 1

	if state.CurrentStreak > state.LongestStreak {
		state.LongestStreak = state.CurrentStreak
	}

	state.LastActivityDate = activityDate.Format("2006-01-02")

	return state, nil
}
