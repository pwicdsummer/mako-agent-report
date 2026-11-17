"""Chapter 15 XOR MLP, TensorFlow float64 reference.

Run: python -m pip install tensorflow matplotlib
     python xor_tensorflow.py --epochs 300 --lr 0.03
The TF optimizer uses its native epsilon convention; tiny differences from
PyTorch / browser Adam are expected, while classification should agree.
"""
import argparse
import csv
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--epochs', type=int, default=300)
    parser.add_argument('--lr', type=float, default=0.03)
    parser.add_argument('--out', type=Path, default=Path('xor-results'))
    args = parser.parse_args()
    if args.epochs < 1 or args.lr <= 0:
        parser.error('epochs and lr must be positive')
    import tensorflow as tf
    tf.keras.backend.set_floatx('float64')
    x = tf.constant([[0., 0.], [0., 1.], [1., 0.], [1., 1.]], dtype=tf.float64)
    target = tf.constant([[0.], [1.], [1.], [0.]], dtype=tf.float64)
    W = tf.Variable([[2., -2.], [-2., 2.]], dtype=tf.float64)
    b_hidden = tf.Variable([-1., -1.], dtype=tf.float64)
    v = tf.Variable([[3.], [3.]], dtype=tf.float64)
    b_output = tf.Variable([-2.5], dtype=tf.float64)
    parameters = [W, b_hidden, v, b_output]
    optimizer = tf.keras.optimizers.Adam(learning_rate=args.lr, beta_1=.9, beta_2=.999, epsilon=1e-8)

    def forward():
        return tf.matmul(tf.sigmoid(tf.matmul(x, W) + b_hidden), v) + b_output

    def record(epoch):
        logits = forward()
        prob = tf.sigmoid(logits)
        loss = tf.reduce_mean(tf.nn.sigmoid_cross_entropy_with_logits(labels=target, logits=logits))
        accuracy = tf.reduce_mean(tf.cast(tf.equal(prob >= .5, target >= .5), tf.float64))
        flat = [float(a) for p in parameters for a in tf.reshape(p, [-1]).numpy()]
        return [epoch, float(loss), float(accuracy), *prob.numpy().ravel().tolist(), *flat]

    history = [record(0)]
    for epoch in range(1, args.epochs + 1):
        with tf.GradientTape() as tape:
            logits = forward()
            loss = tf.reduce_mean(tf.nn.sigmoid_cross_entropy_with_logits(labels=target, logits=logits))
        gradients = tape.gradient(loss, parameters)
        optimizer.apply_gradients(zip(gradients, parameters))
        history.append(record(epoch))

    args.out.mkdir(parents=True, exist_ok=True)
    with (args.out / 'tf-history.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['epoch', 'loss', 'accuracy', 'p00', 'p01', 'p10', 'p11',
                         'W11', 'W12', 'W21', 'W22', 'bh1', 'bh2', 'v1', 'v2', 'bo'])
        writer.writerows(history)
    prob = tf.sigmoid(forward()).numpy().ravel().tolist()
    result = {
        'framework': 'TensorFlow', 'version': tf.__version__, 'dtype': 'float64',
        'config': {'hidden': 2, 'activation': 'sigmoid', 'optimizer': 'adam',
                   'lr': args.lr, 'epochs': args.epochs, 'init': 'course'},
        'initial_loss': history[0][1], 'final_loss': history[-1][1],
        'accuracy': history[-1][2], 'probabilities': prob,
        'predictions': [int(p >= .5) for p in prob],
        'parameters': {name: p.numpy().tolist() for name, p in
                       zip(['W', 'b_hidden', 'v', 'b_output'], parameters)},
        'note': 'Native TF Adam epsilon convention may yield tiny numerical differences.'
    }
    (args.out / 'tf-result.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.plot([r[0] for r in history], [r[1] for r in history], color='#657e70')
        ax.set(xlabel='Epoch', ylabel='Mean BCE', title='XOR learning curve (TensorFlow)')
        fig.tight_layout()
        fig.savefig(args.out / 'tf-learning.png', dpi=180)
        plt.close(fig)
    except ImportError:
        print('Install matplotlib to generate the optional plot.')
    print('Saved to:', args.out.resolve())


if __name__ == '__main__':
    main()
