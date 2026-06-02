import React from 'react';
import styles from './BonsaiTree.module.css';

/**
 * BonsaiTree — SVG component that renders a bonsai at the correct stage
 * Stages: seed, sprout, bush, tree, blossom, legendary
 */
export default function BonsaiTree({ stage = 'seed', xp = 0, nextStage }) {
  const stageId = stage?.id || stage;

  return (
    <div className={styles.bonsaiContainer}>
      <div className={`${styles.bonsai} ${styles[stageId]}`}>
        {/* Pot */}
        <div className={styles.pot}>
          <div className={styles.potTop}></div>
          <div className={styles.potBody}></div>
          <div className={styles.soil}></div>
        </div>

        {/* Trunk — grows with stages */}
        {stageId !== 'seed' && (
          <div className={styles.trunk}>
            {/* Branches */}
            {(stageId === 'bush' || stageId === 'tree' || stageId === 'blossom' || stageId === 'legendary') && (
              <>
                <div className={`${styles.branch} ${styles.branchLeft}`}></div>
                <div className={`${styles.branch} ${styles.branchRight}`}></div>
              </>
            )}
            {(stageId === 'tree' || stageId === 'blossom' || stageId === 'legendary') && (
              <>
                <div className={`${styles.branch} ${styles.branchLeftHigh}`}></div>
                <div className={`${styles.branch} ${styles.branchRightHigh}`}></div>
              </>
            )}
          </div>
        )}

        {/* Leaves / Crown */}
        {stageId === 'seed' && (
          <div className={styles.seedling}>
            <div className={styles.seedDot}></div>
          </div>
        )}

        {stageId === 'sprout' && (
          <div className={styles.sproutLeaves}>
            <div className={`${styles.leaf} ${styles.leaf1}`}></div>
            <div className={`${styles.leaf} ${styles.leaf2}`}></div>
            <div className={`${styles.leaf} ${styles.leaf3}`}></div>
          </div>
        )}

        {stageId === 'bush' && (
          <div className={styles.bushCrown}>
            <div className={styles.crownCircle}></div>
          </div>
        )}

        {(stageId === 'tree') && (
          <div className={styles.treeCrown}>
            <div className={`${styles.crownCircle} ${styles.crownMain}`}></div>
            <div className={`${styles.crownCircle} ${styles.crownLeft}`}></div>
            <div className={`${styles.crownCircle} ${styles.crownRight}`}></div>
          </div>
        )}

        {stageId === 'blossom' && (
          <div className={styles.blossomCrown}>
            <div className={`${styles.crownCircle} ${styles.crownMain} ${styles.pink}`}></div>
            <div className={`${styles.crownCircle} ${styles.crownLeft} ${styles.pink}`}></div>
            <div className={`${styles.crownCircle} ${styles.crownRight} ${styles.pink}`}></div>
            {/* Petals falling */}
            <div className={styles.petals}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.petal} style={{
                  left: `${15 + Math.random() * 70}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}></div>
              ))}
            </div>
          </div>
        )}

        {stageId === 'legendary' && (
          <div className={styles.legendaryCrown}>
            <div className={`${styles.crownCircle} ${styles.crownMain} ${styles.golden}`}></div>
            <div className={`${styles.crownCircle} ${styles.crownLeft} ${styles.golden}`}></div>
            <div className={`${styles.crownCircle} ${styles.crownRight} ${styles.golden}`}></div>
            {/* Sparkle particles */}
            <div className={styles.sparkles}>
              {[...Array(10)].map((_, i) => (
                <div key={i} className={styles.sparkle} style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${Math.random() * 80}%`,
                  animationDelay: `${i * 0.4}s`,
                }}></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      {nextStage && (
        <div className={styles.xpSection}>
          <div className={styles.xpBar}>
            <div
              className={styles.xpFill}
              style={{
                width: `${Math.min(100, ((xp - (stage?.minXP || 0)) / ((nextStage?.minXP || 1) - (stage?.minXP || 0))) * 100)}%`
              }}
            ></div>
          </div>
          <span className={styles.xpLabel}>{xp} / {nextStage.minXP} XP</span>
        </div>
      )}
      {!nextStage && (
        <div className={styles.xpSection}>
          <span className={styles.xpLabel}>✨ Nivel Maxim — {xp} XP</span>
        </div>
      )}
    </div>
  );
}
