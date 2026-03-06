from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import EvalCallback
from stable_baselines3.common.evaluation import evaluate_policy
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv

from rl.env import HunterWumpusEnv

DEFAULT_TOTAL_TIMESTEPS = 1_000_000
DEFAULT_SEED = 42
GRID_SIZE = 10
NUM_PITS = 2


class RandomPolicy:
    def __init__(self, n_actions: int, seed: int) -> None:
        self._rng = np.random.default_rng(seed)
        self._n_actions = n_actions

    def predict(
        self,
        observation: np.ndarray,
        state: None = None,
        episode_start: np.ndarray | None = None,
        deterministic: bool = True,
    ) -> tuple[np.ndarray, None]:
        del observation
        del state
        del episode_start
        del deterministic
        action = np.array([self._rng.integers(0, self._n_actions, dtype=np.int64)])
        return action, None


def build_training_env(seed: int) -> DummyVecEnv:
    def _factory() -> Monitor:
        env = HunterWumpusEnv(size=GRID_SIZE, num_pits=NUM_PITS)
        env.reset(seed=seed)
        return Monitor(env)

    return DummyVecEnv([_factory])


def build_eval_env(seed: int) -> Monitor:
    env = HunterWumpusEnv(size=GRID_SIZE, num_pits=NUM_PITS)
    env.reset(seed=seed)
    return Monitor(env)


def train_and_save(
    total_timesteps: int,
    output_path: Path,
    seed: int,
) -> tuple[Path, float, float]:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    train_env = build_training_env(seed=seed)
    eval_env = build_eval_env(seed=seed + 1)
    try:
        eval_callback = EvalCallback(
            eval_env=eval_env,
            best_model_save_path=str(output_path.parent),
            log_path=str(output_path.parent),
            eval_freq=10_000,
            n_eval_episodes=20,
            deterministic=True,
            render=False,
        )

        model = PPO(
            policy="MlpPolicy",
            env=train_env,
            learning_rate=3e-4,
            n_steps=2048,
            batch_size=64,
            n_epochs=10,
            gamma=0.99,
            verbose=1,
            seed=seed,
        )

        model.learn(total_timesteps=total_timesteps, callback=eval_callback)

        random_policy = RandomPolicy(n_actions=4, seed=seed)
        random_reward, _ = evaluate_policy(
            random_policy,
            eval_env,
            n_eval_episodes=100,
            deterministic=True,
        )
        trained_reward, _ = evaluate_policy(
            model,
            eval_env,
            n_eval_episodes=100,
            deterministic=True,
        )

        if trained_reward - random_reward < 20.0:
            message = (
                "Trained model does not meet minimum improvement over random policy: "
                f"trained={trained_reward:.2f}, random={random_reward:.2f}"
            )
            raise RuntimeError(message)

        save_path = output_path.with_suffix("")
        model.save(str(save_path))
        return save_path.with_suffix(".zip"), random_reward, trained_reward
    finally:
        eval_env.close()
        train_env.close()


def parse_args() -> argparse.Namespace:
    default_output = Path(__file__).resolve().parents[1] / "models" / "hunter_wumpus_model.zip"
    parser = argparse.ArgumentParser(description="Train PPO agent for Hunter Wumpus")
    parser.add_argument(
        "--steps",
        "--timesteps",
        type=int,
        default=DEFAULT_TOTAL_TIMESTEPS,
        dest="steps",
        help="Total PPO training timesteps",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=default_output,
        help="Output model path (e.g. models/easy.zip)",
    )
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model_path, random_reward, trained_reward = train_and_save(
        total_timesteps=args.steps,
        output_path=args.output,
        seed=args.seed,
    )
    print(f"Saved model to: {model_path}")
    print(f"Random policy mean reward: {random_reward:.2f}")
    print(f"Trained policy mean reward: {trained_reward:.2f}")


if __name__ == "__main__":
    main()