# Task 0085: Add SMS character optimization utilities

## Description
Create utilities for calculating SMS character counts, segment counts, and warnings for long messages.

## Acceptance Criteria
- [x] Create function to calculate character count with maximum variable lengths
- [x] Implement segment count calculation (160 chars per segment)
- [x] Add warning detection for messages over 160 characters
- [x] Implement URL shortening placeholder for links
- [x] Write tests for character counting and segment calculation

## Implementation Notes
- **SMS Optimization Methods**:
  - `calculateCharacterCount()` - Calculates max length with variable maxLength values
  - `calculateSegmentCount()` - Returns SMS segments (160 single, 153 multi-segment)
  - URL shortening detection (replaces URLs >23 chars with 23-char placeholder)
  - Constants: SMS_SINGLE_SEGMENT_LENGTH (160), SMS_MULTI_SEGMENT_LENGTH (153), SHORTENED_URL_LENGTH (23)

- **Helper Functions**:
  - `renderTemplateWithMetadata()` - Renders template and adds warnings for long SMS
  - `detectAndShortenUrls()` - Detects and shortens URLs (placeholder implementation)
  - `calculateMaxSmsLength()` - Returns maxLength, wouldExceedSingleSegment, estimatedSegments

- **Unit Tests**:
  - Tests for basic character count
  - Tests for accounting maximum variable lengths
  - Tests for multiple variables with max lengths
  - Tests for URL shortening in character count
  - Tests for segment count calculation (0, 1, 2+ segments)
  - Tests for typical SMS confirmation messages
  - Tests for helper function behavior

- All SMS optimization logic integrated into HandlebarsTemplateEngine class

## References
- Req 18.1, Req 18.2, Req 18.3, Req 18.4, Req 18.5

## Complexity
Small

## Category
Template Engine Implementation
