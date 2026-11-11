## ADDED Requirements
### Requirement: Validator SHALL support alpha change deltas
The validator SHALL accept deltas provided by the test harness.

#### Scenario: Apply alpha delta
- **GIVEN** the test change delta
- **WHEN** openspec validate runs
- **THEN** the validator reports the change as valid