"""Chapter 15 XOR MLP, PyTorch float64 reference.

Run: python -m pip install torch matplotlib
     python xor_torch.py --epochs 300 --lr 0.03
Writes post-update metrics for epochs 0..N, probabilities, parameters and plots.
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
    import torch
    import torch.nn.functional as F
    torch.set_default_dtype(torch.float64)
    x = torch.tensor([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])
    target = torch.tensor([[0.], [1.], [1.], [0.]])
    W = torch.nn.Parameter(torch.tensor([[2., -2.], [-2., 2.]]))
    b_hidden = torch.nn.Parameter(torch.tensor([-1., -1.]))
    v = torch.nn.Parameter(torch.tensor([[3.], [3.]]))
    b_output = torch.nn.Parameter(torch.tensor([-2.5]))
    parameters = [W, b_hidden, v, b_output]
    optimizer = torch.optim.Adam(parameters, lr=args.lr, betas=(0.9, 0.999), eps=1e-8)

    def forward():
        hidden = torch.sigmoid(x @ W + b_hidden)
        return hidden @ v + b_output

    def record(epoch):
        with torch.no_grad():
            logits = forward()
            prob = torch.sigmoid(logits)
            loss = F.binary_cross_entropy_with_logits(logits, target).item()
            accuracy = ((prob >= 0.5) == target.bool()).double().mean().item()
            flat = [value for p in parameters for value in p.flatten().tolist()]
            return [epoch, loss, accuracy, *prob.flatten().tolist(), *flat]

    history = [record(0)]
    for epoch in range(1, args.epochs + 1):
        optimizer.zero_grad(set_to_none=True)
        logits = forward()
        loss = F.binary_cross_entropy_with_logits(logits, target)
        loss.backward()   # autograd applies the chain rule
        optimizer.step()  # Adam changes the model parameters
        history.append(record(epoch))  # evaluate AFTER the update

    args.out.mkdir(parents=True, exist_ok=True)
    with (args.out / 'torch-history.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['epoch', 'loss', 'accuracy', 'p00', 'p01', 'p10', 'p11',
                         'W11', 'W12', 'W21', 'W22', 'bh1', 'bh2', 'v1', 'v2', 'bo'])
        writer.writerows(history)
    with torch.no_grad():
        prob = torch.sigmoid(forward()).flatten().tolist()
    result = {
        'framework': 'PyTorch', 'version': torch.__version__, 'dtype': 'float64',
        'config': {'hidden': 2, 'activation': 'sigmoid', 'optimizer': 'adam',
                   'lr': args.lr, 'epochs': args.epochs, 'init': 'course'},
        'initial_loss': history[0][1], 'final_loss': history[-1][1],
        'accuracy': history[-1][2], 'probabilities': prob,
        'predictions': [int(p >= .5) for p in prob],
        'parameters': {name: p.detach().tolist() for name, p in
                       zip(['W', 'b_hidden', 'v', 'b_output'], parameters)},
        'note': 'All four XOR samples are training data; no held-out test set.'
    }
    (args.out / 'torch-result.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        fig, axes = plt.subplots(1, 2, figsize=(10, 4))
        axes[0].plot([r[0] for r in history], [r[1] for r in history], color='#657e70')
        axes[0].set(xlabel='Epoch', ylabel='Mean BCE', title='XOR learning curve')
        with torch.no_grad():
            axis = torch.linspace(0, 1, 150)
            yy, xx = torch.meshgrid(axis, axis, indexing='ij')
            grid = torch.stack([xx.flatten(), yy.flatten()], dim=1)
            zz = torch.sigmoid(torch.sigmoid(grid @ W + b_hidden) @ v + b_output).reshape(150, 150)
        axes[1].contourf(xx.numpy(), yy.numpy(), zz.numpy(), levels=20, cmap='RdYlGn_r', vmin=0, vmax=1)
        axes[1].contour(xx.numpy(), yy.numpy(), zz.numpy(), levels=[.5], colors='white')
        for i, (a, b) in enumerate(x.tolist()):
            axes[1].scatter(a, b, c='black', marker='D' if i in (1, 2) else 'o', s=45)
        axes[1].set(xlabel='x1', ylabel='x2', title='Decision boundary P(1)=0.5')
        fig.tight_layout()
        fig.savefig(args.out / 'torch-learning.png', dpi=180)
        plt.close(fig)
    except ImportError:
        print('Install matplotlib to generate the optional plot.')
    print('Saved to:', args.out.resolve())


if __name__ == '__main__':
    main()
