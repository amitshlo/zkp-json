pipeline {
  agent any
  stages {
    stage('Build') {
      agent {
        docker {
          image 'node:alpine'
        }

      }
      steps {
        sh 'npm install'
        sh 'npm run build'
      }
    }
  }
}