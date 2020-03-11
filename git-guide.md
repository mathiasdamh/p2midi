# WebMidi - P2 project

A project about working midi in a browser

## Git workflow

### Clone repo

`git clone https://github.com/mathiasdamh/p2midi.git`

`git checkout -b dev origin/dev`

### Start work on new feature

`git checkout -b your-awesome-feature dev`

### Merge your feature into dev

Firstly, update your local `dev` branch with new changes:

`git checkout dev`

`git pull --rebase origin dev`

Then, attempt to merge in your changes:

`git checkout dev`

`git merge your-awesome-feature`

If the merge is successfull, please **test that the program compiles and works while on the `dev` branch**.

If the test passes, then:

`git push`

It is recommended to delete your feature branch. If you want to keep it, you will also have ot update it regulairly with changes from `dev`.

`git branch -d your-awesome-feature`

### Push your feature branch (making an *upstream* branch)

If you want, you can push your feature branch to the GitHub repository. This will make sure that there is an online backup of your work on the unfinished feature. It will also let other team-members pull that branch and commit to it. Be aware that this has to be synced as well.

`git checkout your-branch-to-be-shared`

`git push -u origin your-branch-to-be-shared`

Now others can see your branch.

They can pull your branch by entering:

`git checkout --track origin/your-branch-to-be-shared`

This will create a local branch (the *tracking branch*) that is linked to the branch on the GitHub repo (the *upstream branch*)

#### Pushing changes to your upstream branch

`git checkout your-branch-to-be-shared`

Please make sure all changes are committed before proceding. Use `git pull` to get any changes and merge them with your changes. 
