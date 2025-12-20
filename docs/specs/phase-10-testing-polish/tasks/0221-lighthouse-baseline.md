# Task 0221: Establish Lighthouse baseline and performance metrics infrastructure

**Phase**: 10.1 Performance
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Run Lighthouse audits on key pages and create performance metrics infrastructure for ongoing monitoring.

## Requirements

- Run Lighthouse audits on homepage, /book, /services, /contact pages
- Document current scores for Performance, Accessibility, Best Practices, SEO
- Create `src/lib/performance/metrics.ts` with PerformanceMetrics interface
- Implement reportWebVitals function for production monitoring

## Acceptance Criteria

- [ ] Baseline Lighthouse scores documented for all 4 pages
- [ ] Performance metrics infrastructure created in `src/lib/performance/metrics.ts`
- [ ] PerformanceMetrics TypeScript interface defined
- [ ] reportWebVitals function implemented
- [ ] Metrics can be logged or sent to analytics

## Implementation Details

### Files to Create

- `src/lib/performance/metrics.ts` - Performance monitoring utilities

### Files to Modify

- None (baseline establishment)

## References

- **Requirements**: Req 1.1-1.9
- **Design**: Section 10.1.1
