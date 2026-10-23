
package engine

import "testing"

func TestCalculateAwardsXPAndLevelsUp(t *testing.T) {
	result, err := Calculate(AwardRequest{
		CurrentXP:        90,
		CurrentStreak:    1,
		LongestStreak:    1,
		LastActivityDate: "2026-10-22",
		XPReward:         20,
		ActivityDate:     "2026-10-23",
	})

	if err != nil {
		t.Fatal(err)
	}

	if result.XP != 110 {
		t.Fatalf("expected 110 XP, got %d", result.XP)
	}

	if result.Level != 2 {
		t.Fatalf("expected level 2, got %d", result.Level)
	}

	if result.CurrentStreak != 2 {
		t.Fatalf("expected streak 2, got %d", result.CurrentStreak)
	}
}

func TestSameDayDoesNotIncreaseStreak(t *testing.T) {
	result, err := Calculate(AwardRequest{
		CurrentXP:        10,
		CurrentStreak:    3,
		LongestStreak:    3,
		LastActivityDate: "2026-10-23",
		XPReward:         10,
		ActivityDate:     "2026-10-23",
	})

	if err != nil {
		t.Fatal(err)
	}

	if result.CurrentStreak != 3 {
		t.Fatalf("expected streak 3, got %d", result.CurrentStreak)
	}
}

func TestGapResetsCurrentStreak(t *testing.T) {
	result, err := Calculate(AwardRequest{
		CurrentXP:        50,
		CurrentStreak:    5,
		LongestStreak:    5,
		LastActivityDate: "2026-10-20",
		XPReward:         10,
		ActivityDate:     "2026-10-23",
	})

	if err != nil {
		t.Fatal(err)
	}

	if result.CurrentStreak != 1 {
		t.Fatalf("expected streak 1, got %d", result.CurrentStreak)
	}

	if result.LongestStreak != 5 {
		t.Fatalf("expected longest streak 5, got %d", result.LongestStreak)
	}
}
