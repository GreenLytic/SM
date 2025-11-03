/**
 * Utility functions for automatic quality grading of cocoa beans
 * Based on international standards (ISO 2451, ICCO, Codinorm Côte d'Ivoire)
 */

export interface QualityAssessment {
  mouldyBeans: number;
  flatBeans: number;
  violetBeans: number;
  germinatedBeans: number;
  insectDamagedBeans: number;
  foreignMatter: number;
  humidity: number;
}

export interface GradingResult {
  grade: 'Grade I' | 'Grade II' | 'Refusé';
  failedCriteria: string[];
  warnings: string[];
  comments: string;
}

/**
 * Calculate the grade based on quality assessment parameters
 */
export function calculateGrade(assessment: QualityAssessment): GradingResult {
  const failedCriteria: string[] = [];
  const warnings: string[] = [];
  
  // Check humidity (not a blocking factor, but generates a warning)
  if (assessment.humidity > 7.5) {
    warnings.push(`Taux d'humidité trop élevé (${assessment.humidity.toFixed(1)}% > 7.5%)`);
  }
  
  // Calculate total defects (excluding humidity)
  const totalDefects = 
    assessment.mouldyBeans + 
    assessment.flatBeans + 
    assessment.germinatedBeans + 
    assessment.insectDamagedBeans + 
    assessment.foreignMatter;
  
  // Calculate critical defects
  const criticalDefects = 
    assessment.flatBeans + 
    assessment.foreignMatter;
  
  // Check Grade I criteria
  let isGradeI = true;
  
  if (assessment.mouldyBeans > 3) {
    failedCriteria.push(`Fèves moisies (${assessment.mouldyBeans.toFixed(1)}% > 3%)`);
    isGradeI = false;
  }
  
  if (assessment.flatBeans > 3) {
    failedCriteria.push(`Fèves plates/ardoisées (${assessment.flatBeans.toFixed(1)}% > 3%)`);
    isGradeI = false;
  }
  
  if (assessment.germinatedBeans > 3) {
    failedCriteria.push(`Fèves germées (${assessment.germinatedBeans.toFixed(1)}% > 3%)`);
    isGradeI = false;
  }
  
  if (assessment.insectDamagedBeans > 3) {
    failedCriteria.push(`Fèves insectées (${assessment.insectDamagedBeans.toFixed(1)}% > 3%)`);
    isGradeI = false;
  }
  
  if (assessment.foreignMatter > 0.75) {
    failedCriteria.push(`Corps étrangers/débris (${assessment.foreignMatter.toFixed(2)}% > 0.75%)`);
    isGradeI = false;
  }
  
  if (totalDefects > 6) {
    failedCriteria.push(`Défauts cumulés (${totalDefects.toFixed(1)}% > 6%)`);
    isGradeI = false;
  }
  
  if (criticalDefects > 5.75) {
    failedCriteria.push(`Défauts critiques (${criticalDefects.toFixed(1)}% > 5.75%)`);
    isGradeI = false;
  }
  
  // If all Grade I criteria are met
  if (isGradeI) {
    return {
      grade: 'Grade I',
      failedCriteria: [],
      warnings,
      comments: warnings.length > 0 
        ? `Conforme Grade I. ${warnings.join(' ')}`
        : 'Conforme Grade I'
    };
  }
  
  // Check Grade II criteria
  let isGradeII = true;
  const gradeIIFailures: string[] = [];
  
  if (assessment.mouldyBeans > 4) {
    gradeIIFailures.push(`Fèves moisies (${assessment.mouldyBeans.toFixed(1)}% > 4%)`);
    isGradeII = false;
  }
  
  if (assessment.flatBeans > 8) {
    gradeIIFailures.push(`Fèves plates/ardoisées (${assessment.flatBeans.toFixed(1)}% > 8%)`);
    isGradeII = false;
  }
  
  if (assessment.germinatedBeans > 6) {
    gradeIIFailures.push(`Fèves germées (${assessment.germinatedBeans.toFixed(1)}% > 6%)`);
    isGradeII = false;
  }
  
  if (assessment.insectDamagedBeans > 6) {
    gradeIIFailures.push(`Fèves insectées (${assessment.insectDamagedBeans.toFixed(1)}% > 6%)`);
    isGradeII = false;
  }
  
  if (assessment.foreignMatter > 1.5) {
    gradeIIFailures.push(`Corps étrangers/débris (${assessment.foreignMatter.toFixed(2)}% > 1.5%)`);
    isGradeII = false;
  }
  
  if (totalDefects > 12) {
    gradeIIFailures.push(`Défauts cumulés (${totalDefects.toFixed(1)}% > 12%)`);
    isGradeII = false;
  }
  
  // If all Grade II criteria are met
  if (isGradeII) {
    return {
      grade: 'Grade II',
      failedCriteria,
      warnings,
      comments: warnings.length > 0 
        ? `Conforme Grade II. ${warnings.join(' ')}`
        : 'Conforme Grade II'
    };
  }
  
  // If neither Grade I nor Grade II criteria are met
  return {
    grade: 'Refusé',
    failedCriteria: [...failedCriteria, ...gradeIIFailures],
    warnings,
    comments: `Refusé: ${gradeIIFailures.join(', ')}. ${warnings.join(' ')}`
  };
}