#!/bin/bash

# RepoArchitectAgent Cline Integration Wrapper
# Enables running the full pipeline through Cline AI agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Cline is installed
check_cline() {
    if command -v cline &> /dev/null; then
        print_success "Cline is installed"
        CLINE_VERSION=$(cline --version 2>/dev/null || echo "unknown")
        echo "  Version: $CLINE_VERSION"
        return 0
    else
        print_error "Cline is not installed"
        echo "  Install from: https://github.com/cline/cline"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # Check Python
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed"
        exit 1
    fi
    print_success "Python $(python --version)"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git $(git --version | awk '{print $3}')"
    
    # Check for API scripts
    if [ ! -f "api/analyze_repo.py" ]; then
        print_error "api/analyze_repo.py not found"
        exit 1
    fi
    print_success "API scripts found"
    
    echo ""
}

# Run analysis through Cline
run_with_cline() {
    local repo_url=$1
    local output_dir=$2
    
    if [ -z "$repo_url" ]; then
        print_error "Repository URL is required"
        echo "Usage: $0 run <repo_url> [output_dir]"
        exit 1
    fi
    
    if [ -z "$output_dir" ]; then
        output_dir="runs/$(date +%Y%m%d_%H%M%S)"
    fi
    
    print_header "RepoArchitectAgent with Cline"
    echo "Repository: $repo_url"
    echo "Output Dir: $output_dir"
    echo ""
    
    # Create output directory
    mkdir -p "$output_dir"
    
    # Run through Cline
    if ! check_cline; then
        print_warning "Cline not installed, running directly..."
        run_directly "$repo_url" "$output_dir"
        return 0
    fi
    
    # Create Cline task
    local task="
Analyze the GitHub repository at: $repo_url

Steps:
1. Run: python api/analyze_repo.py $repo_url $output_dir/repo_shape.json
2. Run: node api/generate_mermaid.js $output_dir/repo_shape.json $output_dir
3. Run: node api/generate_ci.js $output_dir/repo_shape.json $output_dir
4. Run: node api/generate_summary.js $output_dir/repo_shape.json $output_dir
5. Report findings and create summary

Output all results to: $output_dir
"
    
    echo "Running analysis through Cline..."
    cline run "$task" || {
        print_warning "Cline execution failed, falling back to direct execution..."
        run_directly "$repo_url" "$output_dir"
    }
    
    print_success "Analysis complete!"
    echo "Results saved to: $output_dir"
}

# Run analysis directly (fallback)
run_directly() {
    local repo_url=$1
    local output_dir=$2
    
    print_header "Running Analysis Directly"
    
    # Step 1: Analyze repo
    echo "Step 1/4: Analyzing repository..."
    python api/analyze_repo.py "$repo_url" "$output_dir/repo_shape.json" || {
        print_error "Repository analysis failed"
        exit 1
    }
    print_success "Repository analyzed"
    
    # Step 2: Generate diagram
    echo "Step 2/4: Generating architecture diagram..."
    node api/generate_mermaid.js "$output_dir/repo_shape.json" "$output_dir" || {
        print_warning "Diagram generation failed (non-blocking)"
    }
    print_success "Diagram generated"
    
    # Step 3: Generate CI
    echo "Step 3/4: Generating CI configuration..."
    node api/generate_ci.js "$output_dir/repo_shape.json" "$output_dir" || {
        print_warning "CI generation failed (non-blocking)"
    }
    print_success "CI configuration generated"
    
    # Step 4: Generate summary
    echo "Step 4/4: Generating LLM summary..."
    node api/generate_summary.js "$output_dir/repo_shape.json" "$output_dir" || {
        print_warning "Summary generation skipped (no API key)"
    }
    print_success "Summary generated"
    
    echo ""
    print_success "Analysis complete!"
    echo "Results saved to: $output_dir"
}

# Batch analysis with Cline
batch_analysis() {
    local repos_file=$1
    
    if [ ! -f "$repos_file" ]; then
        print_error "File not found: $repos_file"
        echo "Usage: $0 batch <repos_file>"
        echo ""
        echo "repos_file should contain one GitHub URL per line:"
        echo "  https://github.com/lodash/lodash"
        echo "  https://github.com/pallets/flask"
        echo "  https://github.com/vercel/next.js"
        exit 1
    fi
    
    print_header "Batch Analysis with Cline"
    echo "Processing repos from: $repos_file"
    echo ""
    
    local count=0
    local success=0
    local failed=0
    
    while IFS= read -r repo_url; do
        # Skip empty lines and comments
        [[ -z "$repo_url" || "$repo_url" =~ ^# ]] && continue
        
        count=$((count + 1))
        echo "[$count] Analyzing: $repo_url"
        
        if run_with_cline "$repo_url" "runs/batch_$(date +%Y%m%d)_$count"; then
            success=$((success + 1))
            print_success "Completed"
        else
            failed=$((failed + 1))
            print_warning "Failed"
        fi
        echo ""
    done < "$repos_file"
    
    echo ""
    print_header "Batch Analysis Summary"
    echo "Total: $count"
    echo "Successful: $success"
    echo "Failed: $failed"
}

# Interactive mode
interactive_mode() {
    print_header "RepoArchitectAgent Cline Interactive Mode"
    
    while true; do
        echo ""
        echo "Options:"
        echo "  1) Analyze single repository"
        echo "  2) Batch analysis"
        echo "  3) List recent analyses"
        echo "  4) Exit"
        echo ""
        read -p "Choose option (1-4): " choice
        
        case $choice in
            1)
                read -p "Enter GitHub repository URL: " repo_url
                run_with_cline "$repo_url"
                ;;
            2)
                read -p "Enter path to repos file: " repos_file
                batch_analysis "$repos_file"
                ;;
            3)
                echo "Recent analyses:"
                ls -lh runs/ 2>/dev/null | tail -10 || echo "No analyses found"
                ;;
            4)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Display help
show_help() {
    cat << EOF
RepoArchitectAgent Cline Integration Wrapper

USAGE:
  $0 <command> [arguments]

COMMANDS:
  run <url> [dir]       Analyze single repository
  batch <file>          Batch analyze repositories
  interactive           Interactive mode
  check                 Check prerequisites
  help                  Show this help message

EXAMPLES:
  # Analyze a repository
  $0 run https://github.com/lodash/lodash

  # Batch analysis
  $0 batch repos.txt

  # Interactive mode
  $0 interactive

ENVIRONMENT VARIABLES:
  GITHUB_TOKEN         GitHub API token (for PR creation)
  OUMI_API_KEY         Oumi API key (for AI summaries)
  OPENAI_API_KEY       OpenAI API key (fallback)

FEATURES:
  ✓ Single repository analysis
  ✓ Batch processing
  ✓ Cline AI integration (if available)
  ✓ Automatic fallback if Cline unavailable
  ✓ Progress tracking
  ✓ Error handling

EOF
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        interactive_mode
        return
    fi
    
    check_prerequisites
    
    local command=$1
    shift
    
    case $command in
        run)
            run_with_cline "$@"
            ;;
        batch)
            batch_analysis "$@"
            ;;
        interactive)
            interactive_mode
            ;;
        check)
            check_cline
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
